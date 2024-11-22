{{{fileComment}}}

package {{packageQualifiedName}};

import {{entityClassQualifiedName}};
import org.springframework.data.repository.*;
import org.springframework.stereotype.Repository;

@Repository
public interface {{entityClassName}}Repository extends {{baseRepository}}<{{entityClassName}}, {{primaryKeyType}}> {

}